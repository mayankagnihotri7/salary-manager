require "rails_helper"

RSpec.describe Department, type: :model do
  it "is valid with a name" do
    expect(build(:department)).to be_valid
  end

  it "requires a name" do
    department = build(:department, name: "")

    expect(department).not_to be_valid
    expect(department.errors).to be_of_kind(:name, :blank)
  end

  it "strips surrounding whitespace from the name" do
    expect(build(:department, name: " Sales ").name).to eq("Sales")
  end

  it "requires a unique name" do
    create(:department, name: "Sales")
    duplicate = build(:department, name: "Sales")

    expect(duplicate).not_to be_valid
    expect(duplicate.errors).to be_of_kind(:name, :taken)
  end

  it "cannot be destroyed while it has employees" do
    department = create(:department)
    create(:employee, department: department)

    expect(department.destroy).to be(false)
    expect(Department.exists?(department.id)).to be(true)
  end
end
