require "rails_helper"

RSpec.describe "db/seeds.rb" do
  it "seeds the default employees and the demo users" do
    employees = instance_double(SeedTasks::Employees, call: nil)
    demo_users = instance_double(SeedTasks::DemoUsers, call: nil)
    allow(SeedTasks::Employees).to receive(:new).with(no_args).and_return(employees)
    allow(SeedTasks::DemoUsers).to receive(:new).with(no_args).and_return(demo_users)

    Rails.application.load_seed

    expect(employees).to have_received(:call)
    expect(demo_users).to have_received(:call)
  end
end
