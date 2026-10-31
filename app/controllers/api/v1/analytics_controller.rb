module Api
  module V1
    class AnalyticsController < BaseController
      def show
        group_by = analytics_params.fetch(:group_by, "currency")

        if SalaryStatistics::GROUP_BYS.include?(group_by)
          render json: { group_by:, currencies: SalaryStatistics.new(group_by:).call }
        else
          render json: { error: "group_by must be one of #{SalaryStatistics::GROUP_BYS.join(" ")}" }, status: :bad_request
        end
      end

      private

      def analytics_params
        params.permit(:group_by)
      end
    end
  end
end
