module Api
  module V1
    class BaseController < ApplicationController
      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: "Not found" }, status: :not_found
      end

      rescue_from ActionController::ParameterMissing do |error|
        render json: { error: error.message }, status: :bad_request
      end

      private

      def request_authentication
        render json: { error: "Authentication required" }, status: :unauthorized
      end

      def require_admin
        return if Current.user&.admin?

        render json: { error: "Forbidden" }, status: :forbidden
      end
    end
  end
end
