# bin/rails db:seed: the deterministic 10,000 employees plus the demo admin and viewer.
# The same steps are available individually as rake tasks (see lib/tasks/seed.rake).
SeedTasks::Employees.new.call
SeedTasks::DemoUsers.new.call
