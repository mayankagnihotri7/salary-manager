class AddTrigramSearchIndexesToEmployees < ActiveRecord::Migration[8.1]
  def change
    enable_extension "pg_trgm"

    # Lets the directory's ILIKE '%term%' search use an index for terms of 3+ characters.
    %i[first_name last_name email employee_number].each do |column|
      add_index :employees, column, using: :gin, opclass: :gin_trgm_ops,
                name: "index_employees_on_#{column}_trigram"
    end
  end
end
