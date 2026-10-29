require "rails_helper"

RSpec.describe "Sessions", type: :request do
  let!(:user) { create(:user, :admin, email_address: "admin@example.com", password: "correct-horse-battery") }

  def sign_in_request(email_address: "admin@example.com", password: "correct-horse-battery")
    post "/api/v1/session", params: { email_address: email_address, password: password }, as: :json
  end

  describe "POST /api/v1/session" do
    it "signs in with valid credentials" do
      expect { sign_in_request }.to change(Session, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body

      expect(body["user"]).to eq("id" => user.id, "email_address" => "admin@example.com", "role" => "admin")
      expect(body["csrf_token"]).to be_present
      expect(response.body).not_to include("password")
    end

    it "matches the email address case-insensitively" do
      sign_in_request(email_address: "ADMIN@EXAMPLE.com")

      expect(response).to have_http_status(:created)
    end

    it "rejects a wrong password without creating a session" do
      expect { sign_in_request(password: "wrong-password") }.not_to change(Session, :count)

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an unkown email address" do
      sign_in_request(email_address: "nobody@example.com")

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 rather than an error when credentials are missing" do
      post "/api/v1/session", params: {}, as: :json
      expect(response).to have_http_status(:unauthorized)

      post "/api/v1/session", params: { email_address: "admin@example.com" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/session" do
    it "returns 401 JSON when not signed in" do
      get "/api/v1/session"

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to be_present
    end

    it "returns the current user after signing in" do
      sign_in_request

      get "/api/v1/session"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["user"]["email_address"]).to eq("admin@example.com")
    end
  end

  describe "DELETE /api/v1/session" do
    it "ends the session and removes its record" do
      sign_in_request

      expect { delete "/api/v1/session" }.to change(Session, :count).by(-1)
      expect(response).to have_http_status(:no_content)

      get "/api/v1/session" do
        delete "/api/v1/session"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    it "returns 401 when not signed in" do
      delete "/api/v1/session"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "CSRF protection" do
    around do |example|
      original = ActionController::Base.allow_forgery_protection
      ActionController::Base.allow_forgery_protection = true
      example.run
    ensure
      ActionController::Base.allow_forgery_protection = original
    end

    it "rejects a sign-in request that has no CSRF token" do
      sign_in_request

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
