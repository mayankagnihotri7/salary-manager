module Api
  module V1
    class BaseController < ApplicationController
      private

      def request_authentication
        render json: { error: "Authentication required" }, status: :unauthorized
      end
    end
  end
end
