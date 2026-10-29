require "rails_helper"

RSpec.describe Employee, type: :model do
  it "is valid with the factory defaults" do
    expect(build(:employee)).to be_valid
  end

  describe "required attrs" do
    %i[employee_number first_name last_name email job_title hired_on].each do |attr|
      it "requires #{attr}" do
        employee = build(:employee, attr => nil)

        expect(employee).not_to be_valid
        expect(employee.errors).to be_of_kind(attr, :blank)
      end
    end

    it "requires a department" do
      employee = build(:employee, department: nil)

      expect(employee).not_to be_valid
      expect(employee.errors).to be_of_kind(:department, :blank)
    end
  end

  describe "employee_number" do
    it "must be unique" do
      create(:employee, employee_number: "EMP-00001")
      duplicate = build(:employee, employee_number: "EMP-00001")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors).to be_of_kind(:employee_number, :taken)
    end
  end

  describe "email" do
    it "rejects malformed addresses" do
      expect(build(:employee, email: "not-an-email")).not_to be_valid
    end

    it "is normalized to lowercase without surrounding whitespace" do
      expect(build(:employee, email: " Asha.Rao@Example.COM ").email).to eq("asha.rao@example.com")
    end

    it "is unique regardless of input case" do
      create(:employee, email: "asha.rao@example.com")
      duplicate = build(:employee, email: "ASHA.RAO@example.com")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors).to be_of_kind(:email, :taken)
    end
  end

  describe "country and currency" do
    it "rejects unsupported country codes" do
      expect(build(:employee, country_code: "XX")).not_to be_valid
    end

    it "rejects unsupported currencies" do
      expect(build(:employee, currency: "XXX")).not_to be_valid
    end

    it "allows a currency that is not the country's local currency" do
      expect(build(:employee, country_code: "IN", currency: "USD")).to be_valid
      expect(build(:employee, country_code: "GB", currency: "EUR")).to be_valid
    end

    it "normalizes both to uppercase" do
      employee = build(:employee, country_code: "in", currency: "inr")

      expect(employee).to be_valid
      expect([ employee.country_code, employee.currency ]).to eq(%w[IN INR])
    end
  end

  describe "salary" do
    it "must be greater than zero" do
      [ 0, -1 ].each do |amount|
        employee = build(:employee, salary: amount)

        expect(employee).not_to be_valid
        expect(employee.errors).to be_of_kind(:salary, :greater_than)
      end
    end

    it "accepts the maximum and rejects anything above it" do
      expect(build(:employee, salary: Employee::MAX_SALARY)).to be_valid

      too_high = build(:employee, salary: Employee::MAX_SALARY + BigDecimal("0.01"))

      expect(too_high).not_to be_valid
      expect(too_high.errors).to be_of_kind(:salary, :less_than_or_equal_to)
    end

    it "accepts up to two decimal places" do
      [ "1500000", "100.5", "100.50", BigDecimal("100.05"), 100.5 ].each do |amount|
        expect(build(:employee, salary: amount)).to be_valid
      end
    end

    it "rejects more than two decimal places instead of silently rounding" do
      employee = build(:employee, salary: "100.005")

      expect(employee).not_to be_valid
      expect(employee.errors[:salary]).to include("must have at most 2 decimal places")
    end

    it "rejects non-numeric input" do
      employee = build(:employee, salary: "abc")

      expect(employee).not_to be_valid
      expect(employee.errors).to be_of_kind(:salary, :not_a_number)
    end

     it "overwrites the previous value on update" do
      employee = create(:employee)

      employee.update!(salary: "1600000.50")

      expect(employee.reload.salary).to eq(BigDecimal("1600000.50"))
    end
  end

  describe "status" do
    it "defaults to active" do
      expect(Employee.new.status).to eq("active")
    end

    it "rejects unkown values" do
      expect(build(:employee, status: "retired")).not_to be_valid
    end
  end

  describe "database constraints" do
    it "rejects a non-positive salary even when validations are bypassed" do
      employee = create(:employee)

      expect { employee.update_column(:salary, 0) }.to raise_error(ActiveRecord::CheckViolation)
    end
  end
end
