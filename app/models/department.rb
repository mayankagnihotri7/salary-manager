class Department < ApplicationRecord
  has_many :employees, dependent: :restrict_with_error

  normalizes :name, with: ->(name) { name.strip }

  scope :with_employees_count, -> { left_joins(:employees).group("departments.id").select("departments.*", "COUNT(employees.id) AS employees_count") }
  scope :alphabetical, -> { order(Arel.sql("LOWER(departments.name)")) }

  validates :name, presence: true, uniqueness: true
end
