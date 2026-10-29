class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users, id: :uuid do |t|
      t.string :email_address, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: 'viewer'

      t.timestamps
    end
    add_index :users, :email_address, unique: true
  end
end
