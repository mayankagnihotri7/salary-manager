class CreateDepartments < ActiveRecord::Migration[8.1]
  def change
    create_table :departments, id: :uuid do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :departments, :name, unique: true
  end
end
