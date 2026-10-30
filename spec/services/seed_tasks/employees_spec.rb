require "rails_helper"

RSpec.describe SeedTasks::Employees do
  def snapshot
    Employee.order(:employee_number).map(&:attributes)
  end

  it "creates 10,000 employees with unique employee numbers and emails" do
    described_class.new.call

    expect(Employee.count).to eq(10_000)
    expect(Employee.distinct.count(:employee_number)).to eq(10_000)
    expect(Employee.distinct.count(:email)).to eq(10_000)
    expect(Department.count).to eq(described_class::DEPARTMENTS.size)
  end

  it "generates records that satisfy the model validations" do
    described_class.new(count: 200).call

    invalid = Employee.find_each.reject(&:valid?).map { |e| [ e.employee_number, e.errors.full_messages ] }
    expect(invalid).to be_empty
    expect(Department.all.reject(&:valid?)).to be_empty
  end

  it "produces identical complete records on every run" do
    described_class.new(count: 200).call
    employees = snapshot
    departments = Department.order(:name).map(&:attributes)

    described_class.new(count: 200).call

    expect(snapshot).to eq(employees)
    expect(Department.order(:name).map(&:attributes)).to eq(departments)
  end

  it "produces different data for a different seed" do
    described_class.new(count: 50, seed: 1).call
    first = Employee.order(:employee_number).pluck(:first_name, :last_name, :salary)

    described_class.new(count: 50, seed: 2).call
    second = Employee.order(:employee_number).pluck(:first_name, :last_name, :salary)

    expect(second).not_to eq(first)
  end

  it "keeps salaries within their currency's range, rounded to 1,000" do
    described_class.new(count: 300).call

    Employee.pluck(:currency, :salary).each do |currency, salary|
      expect(described_class::SALARY_RANGES.fetch(currency)).to cover(salary)
      expect(salary % 1_000).to eq(0)
    end
  end

  it "pays most employees in their country's currency and some in another" do
    described_class.new(count: 200).call

    off_local = Employee.pluck(:country_code, :currency).count do |country, currency|
      currency != described_class::COUNTRIES.fetch(country)
    end

    expect(off_local).to be_between(1, 20)
  end

  it "replaces existing employees" do
    existing = create(:employee)

    described_class.new(count: 10).call

    expect(Employee.exists?(existing.id)).to be(false)
    expect(Employee.count).to eq(10)
  end

  it "restores Faker's random generator afterwards" do
    before = Faker::Config.random

    described_class.new(count: 5).call

    expect(Faker::Config.random).to equal(before)
  end

  it "rolls back everything and restores Faker when the insert fails" do
    existing = create(:employee)
    before = Faker::Config.random
    allow(Employee).to receive(:insert_all!).and_raise(ActiveRecord::StatementInvalid, "boom")

    expect { described_class.new(count: 50).call }.to raise_error(ActiveRecord::StatementInvalid, "boom")

    expect(Employee.pluck(:id)).to eq([ existing.id ])
    expect(Department.pluck(:id)).to eq([ existing.department_id ])
    expect(Faker::Config.random).to equal(before)
  end
end
