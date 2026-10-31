module Api
  module V1
    class DashboardsController < BaseController
      def show
        render json: { headcount: Employee.count, currencies: SalaryStatistics.new.call }
      end
    end
  end
end
