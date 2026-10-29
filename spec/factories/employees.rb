FactoryBot.define do
  factory :employee do
    department
    sequence(:employee_number) { |n| format("EMP-%05d", n) }
    sequence(:email) { |n| "employee#{n}@example.com" }

    first_name { "Asha" }
    last_name { "Rao" }
    job_title { "Software Engineer" }
    country_code { "IN" }
    currency { "INR" }
    salary { BigDecimal("1500000.00") }
    hired_on { Date.new(2020, 1, 15) }
    status { "active" }
  end
end
