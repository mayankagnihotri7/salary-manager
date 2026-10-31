require "rails_helper"

RSpec.describe "Departments API", type: :request do
  def departments
    response.parsed_body["departments"]
  end

  it "rejects unauthenticated requests" do
    get "/api/v1/departments"

    expect(response).to have_http_status(:unauthorized)
  end

  context "when signed in" do
    before { sign_in_as(create(:user)) }

    it "returns each department with its employee count, including departments with none" do
      engineering = create(:department, name: "Engineering")
      sales = create(:department, name: "Sales")
      finance = create(:department, name: "Finance")
      create_list(:employee, 3, department: engineering)
      create(:employee, department: sales, status: "active")
      create(:employee, department: sales, status: "terminated")

      get "/api/v1/departments"

      expect(response).to have_http_status(:ok)
      expect(departments).to eq([
        { "id" => engineering.id, "name" => "Engineering", "employees_count" => 3 },
        { "id" => finance.id, "name" => "Finance", "employees_count" => 0 },
        { "id" => sales.id, "name" => "Sales", "employees_count" => 2 }
      ])
    end

    it "orders departments alphabetically, ignoring case" do
      create(:department, name: "beta")
      create(:department, name: "Alpha")
      create(:department, name: "charlie")

      get "/api/v1/departments"

      expect(departments.map { |department| department["name"] }).to eq(%w[Alpha beta charlie])
    end

    it "counts in the database with a single query, however many departments there are" do
      create_list(:department, 5).each { |department| create_list(:employee, 2, department: department) }

      statements = []
      collector = lambda do |*, payload|
        statements << payload[:sql] if payload[:sql].match?(/"departments"|"employees"/)
      end

      ActiveSupport::Notifications.subscribed(collector, "sql.active_record") do
        get "/api/v1/departments"
      end

      expect(response).to have_http_status(:ok)
      expect(departments.map { |department| department["employees_count"] }).to eq([ 2, 2, 2, 2, 2 ])
      expect(statements.size).to eq(1)
    end
  end
end
