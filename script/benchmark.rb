# Usage: bin/rails runner script/benchmark.rb  (after bin/rails db:seed; uses the dev demo admin)
# Times real API requests in-process (signed in as the seeded admin), median of RUNS after a warm-up.
require "benchmark"

RUNS = 30
Rails.logger.level = :warn
ActiveRecord::Base.logger = nil
ActionController::Base.allow_forgery_protection = false

# Loaded before any request: the integration session leaves the execution context unset.
department_id = Department.order(:name).first.id
sample = Employee.order(:employee_number).offset(5000).first

session = ActionDispatch::Integration::Session.new(Rails.application)
session.host! "localhost"
session.post "/api/v1/session", params: { email_address: "admin@example.com", password: "demo-admin-password" }, as: :json
abort "sign-in failed: #{session.response.status}" unless session.response.status.in?([ 200, 201 ])

CASES = {
  "index (default sort, page 1)" => "/api/v1/employees",
  "index per_page=100" => "/api/v1/employees?per_page=100",
  "index last page (offset 9975)" => "/api/v1/employees?page=400",
  "index sort=salary desc" => "/api/v1/employees?sort=salary&dir=desc",
  "index sort=department" => "/api/v1/employees?sort=department",
  "filters: department+country+status" => "/api/v1/employees?department_id=#{department_id}&country_code=US&status=active",
  "search 1 term (common: 'an')" => "/api/v1/employees?q=an",
  "search 1 term (rare: last name)" => "/api/v1/employees?q=#{sample.last_name}",
  "search 2 terms (first + last name)" => "/api/v1/employees?q=#{sample.first_name}+#{sample.last_name}",
  "search employee number" => "/api/v1/employees?q=#{sample.employee_number}",
  "search no match" => "/api/v1/employees?q=zzzzqqq",
  "dashboard" => "/api/v1/dashboard",
  "analytics group_by=currency" => "/api/v1/analytics?group_by=currency",
  "analytics group_by=department" => "/api/v1/analytics?group_by=department",
  "analytics group_by=country" => "/api/v1/analytics?group_by=country"
}.freeze

def median(values) = values.sort[values.size / 2]

puts format("%-38s %8s %8s %8s", "case (#{RUNS} runs)", "median", "p95", "max")
CASES.each do |name, path|
  session.get path
  abort "#{name}: HTTP #{session.response.status}" unless session.response.status == 200

  times = Array.new(RUNS) { Benchmark.realtime { session.get path } * 1000 }
  p95 = times.sort[(RUNS * 0.95).ceil - 1]
  puts format("%-38s %6.1fms %6.1fms %6.1fms", name, median(times), p95, times.max)
end
