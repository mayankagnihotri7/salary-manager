require "rails_helper"

RSpec.describe "Dashboard and analytics", type: :request do
  it "rejects unauthenticated requests" do
    get "/api/v1/dashboard"
    expect(response).to have_http_status(:unauthorized)

    get "/api/v1/analytics"
    expect(response).to have_http_status(:unauthorized)
  end

  context "when signed in" do
    before do
      sign_in_as(create(:user))
      engineering = create(:department, name: "Engineering")
      create(:employee, department: engineering, currency: "USD", salary: "100")
      create(:employee, department: engineering, currency: "USD", salary: "300")
      create(:employee, department: engineering, currency: "EUR", salary: "1000")
    end

    it "returns the headcount and per-currency statistics on the dashboard" do
      get "/api/v1/dashboard"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        "headcount" => 3,
        "currencies" => [
          { "currency" => "EUR", "headcount" => 1, "min" => "1000.0", "avg" => "1000.0",
            "median" => "1000.0", "max" => "1000.0" },
          { "currency" => "USD", "headcount" => 2, "min" => "100.0", "avg" => "200.0",
            "median" => "200.0", "max" => "300.0" }
        ]
      )
    end

    it "groups analytics by currency by default, without a breakdown" do
      get "/api/v1/analytics"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["group_by"]).to eq("currency")
      expect(response.parsed_body["currencies"].map { |currency| currency["currency"] }).to eq(%w[EUR USD])
      expect(response.parsed_body["currencies"].first).not_to have_key("groups")
    end

    it "nests the department breakdown inside each currency" do
      create(:employee, department: create(:department, name: "Sales"), currency: "USD", salary: "500")

      get "/api/v1/analytics", params: { group_by: "department" }

      usd = response.parsed_body["currencies"].find { |currency| currency["currency"] == "USD" }
      expect(response.parsed_body["group_by"]).to eq("department")
      expect(usd["groups"]).to eq([
        { "key" => "Engineering", "headcount" => 2, "min" => "100.0", "avg" => "200.0",
          "median" => "200.0", "max" => "300.0" },
        { "key" => "Sales", "headcount" => 1, "min" => "500.0", "avg" => "500.0",
          "median" => "500.0", "max" => "500.0" }
      ])
    end

    it "rejects an unknown group_by" do
      get "/api/v1/analytics", params: { group_by: "salary" }

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["error"]).to include("group_by must be one of")
    end
  end
end
