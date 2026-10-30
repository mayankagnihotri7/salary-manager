module SeedTasks
  class Employees
    DEFAULT_SEED = 20_261_029
    DEFAULT_COUNT = 10_000
    SEEDED_AT = Time.utc(2026, 1, 1)
    HIRED_FROM = Date.new(2015, 1, 1)
    HIRED_TO = Date.new(2026, 6, 30)

    DEPARTMENTS = {
      "Engineering" => [ "Software Engineer", "QA Engineer", "DevOps Engineer" ],
      "Sales" => [ "Account Executive", "Sales Manager", "Sales Development Rep" ],
      "Operations" => [ "Operations Analyst", "Operations Manager", "Logistics Coordinator" ],
      "Customer Support" => [ "Support Specialist", "Support Team Lead", "Customer Success Manager" ],
      "Finance" => [ "Accountant", "Financial Analyst", "Finance Manager" ],
      "Human Resources" => [ "Recruiter", "HR Generalist", "HR Manager" ],
      "Marketing" => [ "Marketing Specialist", "Content Strategist", "Marketing Manager" ],
      "Product" => [ "Product Manager", "Product Designer", "Business Analyst" ]
    }.freeze

    # country => local currency
    COUNTRIES = {
      "US" => "USD", "GB" => "GBP", "DE" => "EUR", "FR" => "EUR", "IN" => "INR", "JP" => "JPY",
      "AU" => "AUD", "CA" => "CAD", "SG" => "SGD", "BR" => "BRL", "MX" => "MXN", "ZA" => "ZAR"
    }.freeze

    # currency => annual salary range in that currency (salaries are rounded to 1,000)
    SALARY_RANGES = {
      "USD" => 50_000..180_000,
      "EUR" => 40_000..140_000,
      "GBP" => 35_000..120_000,
      "INR" => 600_000..4_000_000,
      "JPY" => 4_000_000..14_000_000,
      "AUD" => 70_000..200_000,
      "CAD" => 60_000..180_000,
      "SGD" => 55_000..180_000,
      "BRL" => 70_000..350_000,
      "MXN" => 250_000..1_000_000,
      "ZAR" => 200_000..900_000
    }.freeze

    def initialize(count: DEFAULT_COUNT, seed: DEFAULT_SEED)
      @count = count
      @rng = Random.new(seed)
    end

    def call
      previous_random = Faker::Config.random
      Faker::Config.random = @rng

      ActiveRecord::Base.transaction do
        Employee.delete_all
        Department.delete_all

        department_ids = DEPARTMENTS.keys.to_h { |name| [ name, uuid_for("department", name) ] }
        Department.insert_all!(department_ids.map do |name, id|
          { id: id, name: name, created_at: SEEDED_AT, updated_at: SEEDED_AT }
        end)
        Employee.insert_all!((1..@count).map { |number| build_employee(number, department_ids) })
      end
    ensure
      Faker::Config.random = previous_random
    end

    private

    # The order of the random draws below is part of the seed: reordering them
    # changes the generated data.
    def build_employee(number, department_ids)
      first_name = Faker::Name.first_name
      last_name = Faker::Name.last_name
      department = DEPARTMENTS.keys.sample(random: @rng)
      job_title = DEPARTMENTS.fetch(department).sample(random: @rng)
      country_code = COUNTRIES.keys.sample(random: @rng)
      hired_on = Faker::Date.between(from: HIRED_FROM, to: HIRED_TO)

      # Every 10th employee is paid in USD whatever their country, so country and
      # pay currency are visibly independent.
      currency = (number % 10).zero? ? "USD" : COUNTRIES.fetch(country_code)
      salary = @rng.rand(SALARY_RANGES.fetch(currency)).round(-3)

      # Every 20th employee is terminated, every 25th (that isn't a 20th) is on leave.
      # rubocop:disable Layout/ElseAlignment
      # rubocop:disable Layout/EndAlignment
      status = if (number % 20).zero?
                 "terminated"
               elsif (number % 25).zero?
                  "on_leave"
               else
                  "active"
               end

      employee_number = format("EMP-%05d", number)
      # The number makes the address unique; anything but a-z 0-9 . @ is stripped so it stays valid.
      email = "#{first_name}.#{last_name}.#{number}@example.com".downcase.delete("^a-z0-9.@")

      {
        id: uuid_for("employee", employee_number),
        employee_number: employee_number,
        first_name: first_name,
        last_name: last_name,
        email: email,
        job_title: job_title,
        department_id: department_ids.fetch(department),
        country_code: country_code,
        currency: currency,
        salary: salary,
        hired_on: hired_on,
        status: status,
        created_at: SEEDED_AT,
        updated_at: SEEDED_AT
      }
    end

    # Same input => same UUID, so ids are identical on every run.
    def uuid_for(kind, key)
      Digest::UUID.uuid_v5(Digest::UUID::URL_NAMESPACE, "urn:salary-manager:#{kind}:#{key}")
    end
  end
end
