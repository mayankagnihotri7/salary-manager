module Api
  module V1
    class EmployeesController < BaseController
      FILTERS = %i[department_id country_code currency status].freeze
      DEFAULT_PER_PAGE = 25
      MAX_PER_PAGE = 100
      before_action :require_admin, only: :update

      def index
        filters = employee_filters
        matching = Employee.search(index_params[:q]).where(filters)

        page = index_params[:page].to_i
        page = 1 unless page.positive?

        per_page = index_params[:per_page].to_i
        per_page = per_page.positive? ? [ per_page, MAX_PER_PAGE ].min : DEFAULT_PER_PAGE

        total_count = matching.count

        employees = matching.eager_load(:department)
                            .sorted_by(index_params[:sort], index_params[:dir])
                            .limit(per_page)
                            .offset((page - 1) * per_page)

        render json: {
          employees: employees.map { |employee| employee_payload(employee) },
          meta: {
            page:, per_page:, total_count:,
            total_pages: (total_count / per_page.to_f).ceil
          }
        }
      end

      def show
        employee = Employee.includes(:department).find(params[:id])

        render json: { employee: employee_payload(employee) }
      end

      def update
        employee = Employee.includes(:department).find(params[:id])

        if employee.update(employee_params)
          render json: { employee: employee_payload(employee) }
        else
          render json: { errors: employee.errors.to_hash }, status: 422
        end
      end

      private

      def index_params
        params.permit(:q, :department_id, :country_code, :currency, :status, :sort, :dir, :page, :per_page)
      end

      def employee_params
        params.require(:employee).permit(:salary)
      end

      def employee_filters
        index_params.slice(*FILTERS).to_h.compact_blank
      end

      def employee_payload(employee)
        {
          id: employee.id,
          employee_number: employee.employee_number,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          job_title: employee.job_title,
          department: { id: employee.department_id, name: employee.department.name },
          country_code: employee.country_code,
          currency: employee.currency,
          salary: employee.salary.to_s("F"),
          hired_on: employee.hired_on,
          status: employee.status
        }
      end
    end
  end
end
