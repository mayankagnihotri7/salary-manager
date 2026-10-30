require "rails_helper"

RSpec.describe SeedTasks::DemoUsers do
  let(:env) do
    {
      "SEED_ADMIN_EMAIL" => "boss@example.com", "SEED_ADMIN_PASSWORD" => "admin-password-1",
      "SEED_VIEWER_EMAIL" => "reader@example.com", "SEED_VIEWER_PASSWORD" => "viewer-password-1"
    }
  end

  it "creates an admin and a viewer from the environment" do
    described_class.new(env: env, allow_default_passwords: false).call

    admin = User.find_by!(email_address: "boss@example.com")
    viewer = User.find_by!(email_address: "reader@example.com")
    expect([ admin.role, viewer.role ]).to eq(%w[admin viewer])
    expect(User.authenticate_by(email_address: "boss@example.com", password: "admin-password-1")).to eq(admin)
  end

  it "is idempotent and refreshes the password" do
    described_class.new(env: env, allow_default_passwords: false).call
    described_class.new(env: env.merge("SEED_ADMIN_PASSWORD" => "new-admin-password"),
                        allow_default_passwords: false).call

    expect(User.count).to eq(2)
    expect(User.authenticate_by(email_address: "boss@example.com", password: "new-admin-password")).to be_present
  end

  it "refuses to invent passwords when defaults are not allowed" do
    expect { described_class.new(env: {}, allow_default_passwords: false).call }
      .to raise_error(KeyError, /SEED_ADMIN_PASSWORD/)
    expect(User.count).to eq(0)
  end

  it "falls back to the documented demo credentials when allowed" do
    described_class.new(env: {}, allow_default_passwords: true).call

    expect(User.authenticate_by(email_address: "viewer@example.com", password: "demo-viewer-password")).to be_viewer
  end
end
