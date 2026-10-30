FactoryBot.define do
  factory :employee do
    department
    sequence(:employee_number) { |n| format("EMP-%05d", n) }
    sequence(:email) { |n| "employee#{n}@example.com" }

    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    job_title { Faker::Job.title }
    country_code { "IN" }
    currency { "INR" }
    salary { BigDecimal("1500000.00") }
    hired_on { Faker::Date.between(from: Date.new(2015, 1, 1), to: Date.new(2026, 6, 30)) }
    status { "active" }
  end
end
