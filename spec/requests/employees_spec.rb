require "rails_helper"

RSpec.describe "Employees API", type: :request do
  def employee_numbers
    response.parsed_body["employees"].map { |employee| employee["employee_number"] }
  end

  describe "authentication" do
    it "rejects unauthenticated requests" do
      employee = create(:employee)

      get "/api/v1/employees"
      expect(response).to have_http_status(:unauthorized)

      get "/api/v1/employees/#{employee.id}"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context "when signed in as a viewer" do
    before { sign_in_as(create(:user)) }

    describe "GET /api/v1/employees" do
      it "returns employees with their department and pagination metadata" do
        department = create(:department, name: "Engineering")
        employee = create(:employee, department: department, employee_number: "EMP-00001",
                                     first_name: "Asha", last_name: "Rao", email: "asha.rao@example.com",
                                     job_title: "Software Engineer", country_code: "IN", currency: "INR",
                                     salary: "1500000.00", hired_on: Date.new(2020, 1, 15), status: "active")

        get "/api/v1/employees"

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["meta"]).to eq(
          "page" => 1, "per_page" => 25, "total_count" => 1, "total_pages" => 1
        )
        expect(response.parsed_body["employees"]).to eq([ {
          "id" => employee.id, "employee_number" => "EMP-00001", "first_name" => "Asha",
          "last_name" => "Rao", "email" => "asha.rao@example.com", "job_title" => "Software Engineer",
          "department" => { "id" => department.id, "name" => "Engineering" },
          "country_code" => "IN", "currency" => "INR", "salary" => "1500000.0",
          "hired_on" => "2020-01-15", "status" => "active"
        } ])
      end

      describe "pagination" do
        it "pages through employees ordered by employee number" do
          (1..5).each { |n| create(:employee, employee_number: format("EMP-%05d", n)) }

          get "/api/v1/employees", params: { page: 2, per_page: 2 }

          expect(employee_numbers).to eq(%w[EMP-00003 EMP-00004])
          expect(response.parsed_body["meta"]).to include(
            "page" => 2, "per_page" => 2, "total_count" => 5, "total_pages" => 3
          )
        end

        it "caps per_page and falls back to defaults for invalid values" do
          create(:employee)

          get "/api/v1/employees", params: { per_page: 1_000, page: -3 }
          expect(response.parsed_body["meta"]).to include("page" => 1, "per_page" => 100)

          get "/api/v1/employees", params: { per_page: "abc", page: "xyz" }
          expect(response.parsed_body["meta"]).to include("page" => 1, "per_page" => 25)
        end

        it "keeps pages stable when many rows share the sort value" do
          create_list(:employee, 6, country_code: "IN")

          ids = (1..3).flat_map do |page|
            get "/api/v1/employees", params: { sort: "country_code", per_page: 2, page: page }
            response.parsed_body["employees"].map { |employee| employee["id"] }
          end

          expect(ids.uniq.size).to eq(6)
        end
      end

      describe "search" do
        before do
          create(:employee, employee_number: "EMP-00001", first_name: "Asha", last_name: "Rao",
                            email: "asha.rao@example.com")
          create(:employee, employee_number: "EMP-00002", first_name: "Ravi", last_name: "Raman",
                            email: "ravi.raman@example.com")
          create(:employee, employee_number: "EMP-00003", first_name: "Maria", last_name: "Senger",
                            email: "maria.senger@example.com")
        end

        it "matches names case-insensitively by substring" do
          get "/api/v1/employees", params: { q: "RAM" }

          expect(employee_numbers).to eq(%w[EMP-00002])
        end

        it "matches email and employee number" do
          get "/api/v1/employees", params: { q: "senger@" }
          expect(employee_numbers).to eq(%w[EMP-00003])

          get "/api/v1/employees", params: { q: "emp-00001" }
          expect(employee_numbers).to eq(%w[EMP-00001])
        end

        it "matches a full name in either order" do
          get "/api/v1/employees", params: { q: "asha rao" }
          expect(employee_numbers).to eq(%w[EMP-00001])

          get "/api/v1/employees", params: { q: "rao asha" }
          expect(employee_numbers).to eq(%w[EMP-00001])
        end

        it "treats LIKE wildcards literally" do
          get "/api/v1/employees", params: { q: "%" }
          expect(employee_numbers).to be_empty

          get "/api/v1/employees", params: { q: "_" }
          expect(employee_numbers).to be_empty
        end
      end

      describe "filters" do
        let(:engineering) { create(:department, name: "Engineering") }
        let(:sales) { create(:department, name: "Sales") }

        before do
          create(:employee, employee_number: "EMP-00001", department: engineering,
                            country_code: "IN", currency: "INR", status: "active")
          create(:employee, employee_number: "EMP-00002", department: sales,
                            country_code: "IN", currency: "USD", status: "on_leave")
          create(:employee, employee_number: "EMP-00003", department: sales,
                            country_code: "US", currency: "USD", status: "active")
        end

        it "filters by department" do
          get "/api/v1/employees", params: { department_id: sales.id }

          expect(employee_numbers).to eq(%w[EMP-00002 EMP-00003])
        end

        {
          { country_code: "IN" } => %w[EMP-00001 EMP-00002],
          { currency: "USD" } => %w[EMP-00002 EMP-00003],
          { status: "active" } => %w[EMP-00001 EMP-00003]
        }.each do |filter, expected|
          it "filters by #{filter.keys.first}" do
            get "/api/v1/employees", params: filter

            expect(employee_numbers).to eq(expected)
          end
        end

        it "combines filters and search" do
          get "/api/v1/employees", params: { department_id: sales.id, country_code: "IN", q: "emp" }

          expect(employee_numbers).to eq(%w[EMP-00002])
        end

        it "ignores blank filters" do
          get "/api/v1/employees", params: { currency: "", status: "" }

          expect(employee_numbers).to eq(%w[EMP-00001 EMP-00002 EMP-00003])
        end
      end

      describe "sorting" do
        it "sorts by last name then first name, ascending or descending" do
          create(:employee, employee_number: "EMP-00001", last_name: "Brown", first_name: "Bob")
          create(:employee, employee_number: "EMP-00002", last_name: "Adams", first_name: "Zoe")
          create(:employee, employee_number: "EMP-00003", last_name: "Adams", first_name: "Anna")

          get "/api/v1/employees", params: { sort: "name" }
          expect(employee_numbers).to eq(%w[EMP-00003 EMP-00002 EMP-00001])

          get "/api/v1/employees", params: { sort: "name", dir: "desc" }
          expect(employee_numbers).to eq(%w[EMP-00001 EMP-00002 EMP-00003])
        end

        it "sorts salary within each currency, never across currencies" do
          create(:employee, employee_number: "EMP-00001", currency: "USD", salary: "100000")
          create(:employee, employee_number: "EMP-00002", currency: "USD", salary: "50000")
          create(:employee, employee_number: "EMP-00003", currency: "EUR", salary: "70000")

          get "/api/v1/employees", params: { sort: "salary" }

          expect(employee_numbers).to eq(%w[EMP-00003 EMP-00002 EMP-00001])
        end

        it "falls back to the default order for unknown sort values" do
          create(:employee, employee_number: "EMP-00002")
          create(:employee, employee_number: "EMP-00001")

          get "/api/v1/employees", params: { sort: "salary; DROP TABLE employees", dir: "sideways" }

          expect(response).to have_http_status(:ok)
          expect(employee_numbers).to eq(%w[EMP-00001 EMP-00002])
          expect(Employee.count).to eq(2)
        end
      end
    end

    describe "GET /api/v1/employees/:id" do
      it "returns the employee with its department" do
        employee = create(:employee, department: create(:department, name: "Finance"))

        get "/api/v1/employees/#{employee.id}"

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["employee"]).to include(
          "id" => employee.id, "employee_number" => employee.employee_number,
          "department" => { "id" => employee.department_id, "name" => "Finance" }
        )
      end

      it "returns 404 for unknown and malformed ids" do
        get "/api/v1/employees/#{SecureRandom.uuid}"
        expect(response).to have_http_status(:not_found)

        get "/api/v1/employees/not-a-uuid"
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
