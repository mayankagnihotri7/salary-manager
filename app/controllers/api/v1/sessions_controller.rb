module Api
  module V1
    class SessionsController < BaseController
      allow_unauthenticated_access only: %i[ create ]
      rate_limit to: 10, within: 3.minutes, only: :create,
                 with: -> { render json: { error: "Too many sign-in attempts" }, status: :too_many_requests }

      def show
        render json: session_payload(Current.user)
      end

      def create
        user = User.authenticate_by(user_params) if user_params.key?(:email_address) && user_params.key?(:password)

        if user
          start_new_session_for user
          render json: session_payload(user), status: :created
        else
          render json: { error: "Invalid email address or password" }, status: :unauthorized
        end
      end

      def destroy
        terminate_session
        head :no_content
      end

      private

      def user_params
        params.permit(:email_address, :password)
      end

      def session_payload(user)
        {
          user: { id: user.id, email_address: user.email_address, role: user.role },
          csrf_token: form_authenticity_token
        }
      end
    end
  end
end
