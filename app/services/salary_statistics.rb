class SalaryStatistics
  GROUP_COLUMNS = {
    "currency" => nil,
    "department" => "departments.name",
    "country" => "employees.country_code"
  }.freeze

  GROUP_BYS = GROUP_COLUMNS.keys.freeze
  STATISTICS = {
    headcount: "COUNT(*)",
    min: "MIN(employees.salary)",
    avg: "ROUND(AVG(employees.salary), 2)",
    median: "ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY employees.salary))::numeric, 2)",
    max: "MAX(employees.salary)"
  }.freeze

  def initialize(group_by: "currency")
    @group_column = GROUP_COLUMNS.fetch(group_by)
  end

  def call
    breakdown = @group_column ? rows(@group_column).group_by(&:first) : {}

    rows.map do |currency, *values|
      entry = { currency:, **statistics(values) }

      if @group_column
        entry[:groups] = breakdown.fetch(currency, []).map do |_currency, key, *group_values|
          { key:, **statistics(group_values) }
        end
      end

      entry
    end
  end

  private

  def rows(*group_columns)
    Employee.joins(:department)
            .group("employees.currency", *group_columns)
            .order("employees.currency", *group_columns)
            .pluck("employees.currency", *group_columns, *STATISTICS.values.map { |sql| Arel.sql(sql) })
  end

  def statistics(values)
    STATISTICS.keys.zip(values).to_h
  end
end
