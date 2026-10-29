require 'rails_helper'

RSpec.describe User, type: :model do
  it "is valid with the factory defaults" do
    expect(build(:user)).to be_valid
  end

  it "requires an email address" do
    user = build(:user, email_address: "")

    expect(user).not_to be_valid
    expect(user.errors).to be_of_kind(:email_address, :blank)
  end

  it "rejects malformed email addresses" do
    expect(build(:user, email_address: "not-and-email")).not_to be_valid
  end

  it "normalizes the email address" do
    expect(build(:user, email_address: " HR@Example.COM").email_address).to eq("hr@example.com")
  end

  it "enforces email uniqueness regardless of case" do
    create(:user, email_address: "hr@example.com")
    duplicate = build(:user, email_address: "HR@EXAMPLE.com")

    expect(duplicate).not_to be_valid
    expect(duplicate.errors).to be_of_kind(:email_address, :taken)
  end

  it "requires a password of at least 9 characters" do
    user = build(:user, password: "short")

    expect(user).not_to be_valid
    expect(user.errors).to be_of_kind(:password, :too_short)
  end

  it "stores a digest, never the plain password" do
    user = create(:user, password: "correct-horse-battery")

    expect(user.password_digest).not_to include("correct-horse-battery")
  end

  it "destroys its sessions with the user" do
    user = create(:user)
    user.sessions.create!

    expect { user.destroy }.to change(Session, :count).by(-1)
  end

  describe "role" do
    it "defaults to viewer" do
      expect(User.new.role).to eq("viewer")
      expect(User.new).to be_viewer
    end

    it "can be admin" do
      expect(create(:user, :admin)).to be_admin
    end

    it "rejects unkown roles" do
      expect(build(:user, role: "root")).not_to be_valid
    end
  end
end
