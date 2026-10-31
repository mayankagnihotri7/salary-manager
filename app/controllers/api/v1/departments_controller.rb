module Api
  module V1
    class DepartmentsController < BaseController
      def index
        departments = Department.with_employees_count.alphabetical

        render json: {
          departments: departments.map do |department|
            { id: department.id, name: department.name, employees_count: department.employees_count }
          end
        }
      end
    end
  end
end
