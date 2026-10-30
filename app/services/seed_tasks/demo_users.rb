# Creates (or refreshes) one admin and one viewer account for demos.
# Credentials come from the environment; demo defaults apply outside production only.
module SeedTasks
  class DemoUsers
    USERS = {
      admin: { email_key: "SEED_ADMIN_EMAIL", password_key: "SEED_ADMIN_PASSWORD", default_email: "admin@example.com" },
      viewer: { email_key: "SEED_VIEWER_EMAIL", password_key: "SEED_VIEWER_PASSWORD", default_email: "viewer@example.com" }
    }.freeze

    def initialize(env: ENV, allow_default_passwords: !Rails.env.production?)
      @env = env
      @allow_default_passwords = allow_default_passwords
    end

    def call
      USERS.map do |role, config|
        email = @env.fetch(config[:email_key], config[:default_email])
        user = User.find_or_initialize_by(email_address: email)
        user.update!(password: password_for(role, config[:password_key]), role: role.to_s)
        user
      end
    end

    private

    def password_for(role, key)
      @env.fetch(key) do
        raise KeyError, "#{key} must be set to seed the #{role} user" unless @allow_default_passwords

        "demo-#{role}-password"
      end
    end
  end
end
