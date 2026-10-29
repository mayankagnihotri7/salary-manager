class Employee < ApplicationRecord
  COUNTRY_CODES = %w[US GB DE FR IN DP AU CA SG BR MX ZA].freeze
  CURRENCIES = %w[USD EUR GBP INR JPY AUD CAD SGD BRL MXN ZAR].freeze
  MAX_SALARY = BigDecimal("10000000000")

  belongs_to :department

  enum :status, %w[active on_leave terminated].index_by(&:itself), default: "active", validate: true

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :country_code, :currency, with: ->(value) { value.strip.upcase }
  normalizes :employee_number, :first_name, :last_name, :job_title, with: ->(value) { value.strip }

  validates :employee_number, :first_name, :last_name, :job_title, :hired_on, presence: true
  validates :employee_number, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :country_code, inclusion: { in: COUNTRY_CODES }
  validates :currency, inclusion: { in: CURRENCIES }
  validates :salary, numericality: { greater_than: 0, less_than_or_equal_to: MAX_SALARY }
  validate :salary_has_at_most_two_decimals

  private

  def salary_has_at_most_two_decimals
    raw = salary_before_type_cast
    return if raw.blank?

    amount = BigDecimal(raw.to_s, exception: false)
    return if amount.nil? || !amount.finite? || amount == amount.round(2)

    errors.add(:salary, "must have at most 2 decimal places")
  end
end
