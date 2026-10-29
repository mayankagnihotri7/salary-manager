class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees, id: :uuid do |t|
      t.string :employee_number, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :job_title, null: false
      t.references :department, null: false, foreign_key: true, type: :uuid
      t.string :country_code, null: false, limit: 2
      t.string :currency, null: false, limit: 3
      t.decimal :salary, precision: 14, scale: 2, null: false
      t.date :hired_on, null: false
      t.string :status, null: false, default: 'active'

      t.timestamps
    end

    add_index :employees, :employee_number, unique: true
    add_index :employees, :email, unique: true
    add_index :employees, :country_code
    add_index :employees, :currency
    add_index :employees, :status
    add_index :employees, [ :last_name, :first_name ]
    add_check_constraint :employees, "salary > 0", name: "employees_salary_positive"
  end
end
