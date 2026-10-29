class Department < ApplicationRecord
  has_many :employees, dependent: :restrict_with_error

  normalizes :name, with: ->(name) { name.strip }

  validates :name, presence: true, uniqueness: true
end
