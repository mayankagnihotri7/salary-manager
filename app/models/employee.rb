class Employee < ApplicationRecord
  COUNTRY_CODES = %w[US GB DE FR IN JP AU CA SG BR MX ZA].freeze
  CURRENCIES = %w[USD EUR GBP INR JPY AUD CAD SGD BRL MXN ZAR].freeze
  MAX_SALARY = BigDecimal("10000000000")
  SEARCH_SQL = %w[first_name last_name email employee_number].map { |col| "employees.#{col} ILIKE :pattern" }.join(" OR ").freeze

  # Directory sort options (whitelisted: these strings go into ORDER BY). A direction
  # applies to every column of a sort. Salary sorts by currency first so amounts in
  # different currencies are never ranked against each other.
  SORTS = {
    "employee_number" => %w[employees.employee_number],
    "name" => %w[employees.last_name employees.first_name],
    "job_title" => %w[employees.job_title],
    "department" => %w[departments.name],
    "country_code" => %w[employees.country_code],
    "currency" => %w[employees.currency],
    "salary" => %w[employees.currency employees.salary],
    "hired_on" => %w[employees.hired_on],
    "status" => %w[employees.status]
  }.freeze

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

  def self.search(query)
    query.to_s.split.reduce(all) do |relation, term|
      relation.where(SEARCH_SQL, pattern: "%#{sanitize_sql_like(term)}%")
    end
  end

  def self.sorted_by(sort, direction)
    columns = SORTS.fetch(sort.to_s, SORTS["employee_number"])
    direction = direction.to_s.downcase === "desc" ? "DESC" : "ASC"
    order(Arel.sql((columns.map { |column| "#{column} #{direction}" } << "employees.id ASC").join(", ")))
  end

  private

  def salary_has_at_most_two_decimals
    raw = salary_before_type_cast
    return if raw.blank?

    amount = BigDecimal(raw.to_s, exception: false)
    return if amount.nil? || !amount.finite? || amount == amount.round(2)

    errors.add(:salary, "must have at most 2 decimal places")
  end
end
