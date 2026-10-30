module AuthenticationHelpers
  def sign_in_as(user, password: "correct-horse-battery")
    post "/api/v1/session", params: { email_address: user.email_address, password: user.password }, as: :json

    expect(response).to have_http_status(:created)
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request
end
