RSpec.configure do |config|
  config.before do
    Faker::Config.random = Random.new(config.seed.to_i)
  end
end
