module Api
  module V1
    class BaseController < ApplicationController
      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: "Not found" }, status: :not_found
      end

      private

      def request_authentication
        render json: { error: "Authentication required" }, status: :unauthorized
      end
    end
  end
end
