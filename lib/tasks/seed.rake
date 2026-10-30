namespace :seed do
  desc "Replace all employees and departments with deterministic synthetic data " \
       "(args: count, seed), e.g. bin/rails \"seed:employees[500,7]\""
  task :employees, %i[count seed] => :environment do |_task, args|
    args.with_defaults(count: SeedTasks::Employees::DEFAULT_COUNT, seed: SeedTasks::Employees::DEFAULT_SEED)
    SeedTasks::Employees.new(count: Integer(args[:count]), seed: Integer(args[:seed])).call
  end

  desc "Create or refresh the demo admin and viewer users " \
       "(SEED_ADMIN_EMAIL/PASSWORD, SEED_VIEWER_EMAIL/PASSWORD; passwords required in production)"
  task demo_users: :environment do
    SeedTasks::DemoUsers.new.call
  end

  desc "Employees plus demo users (what db:seed runs)"
  task all: %i[employees demo_users]
end
