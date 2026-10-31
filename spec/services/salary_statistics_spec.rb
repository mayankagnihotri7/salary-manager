require "rails_helper"

RSpec.describe SalaryStatistics do
  def create_employees(currency, salaries, **attributes)
    salaries.each { |salary| create(:employee, currency: currency, salary: salary, **attributes) }
  end

  it "returns nothing when there are no employees" do
    expect(described_class.new.call).to eq([])
  end

  it "calculates statistics per currency without combining currencies" do
    create_employees("USD", %w[100 100 101])
    create_employees("EUR", %w[1000 2000])

    expect(described_class.new.call).to eq([
      { currency: "EUR", headcount: 2, min: BigDecimal("1000"), avg: BigDecimal("1500"),
        median: BigDecimal("1500"), max: BigDecimal("2000") },
      { currency: "USD", headcount: 3, min: BigDecimal("100"), avg: BigDecimal("100.33"),
        median: BigDecimal("100"), max: BigDecimal("101") }
    ])
  end

  it "breaks statistics down by department within each currency" do
    engineering = create(:department, name: "Engineering")
    sales = create(:department, name: "Sales")
    create_employees("USD", %w[100 300], department: engineering)
    create_employees("USD", %w[500], department: sales)
    create_employees("EUR", %w[1000], department: engineering)

    eur, usd = described_class.new(group_by: "department").call

    expect(eur[:groups].map { |group| [ group[:key], group[:headcount] ] }).to eq([ [ "Engineering", 1 ] ])
    expect(usd).to include(headcount: 3, max: BigDecimal("500"))
    expect(usd[:groups]).to eq([
      { key: "Engineering", headcount: 2, min: BigDecimal("100"), avg: BigDecimal("200"),
        median: BigDecimal("200"), max: BigDecimal("300") },
      { key: "Sales", headcount: 1, min: BigDecimal("500"), avg: BigDecimal("500"),
        median: BigDecimal("500"), max: BigDecimal("500") }
    ])
  end

  it "breaks statistics down by country within each currency" do
    create_employees("USD", %w[100 200], country_code: "US")
    create_employees("USD", %w[400], country_code: "IN")

    usd = described_class.new(group_by: "country").call.first

    expect(usd[:groups].map { |group| [ group[:key], group[:headcount], group[:avg] ] }).to eq(
      [ [ "IN", 1, BigDecimal("400") ], [ "US", 2, BigDecimal("150") ] ]
    )
  end
end
