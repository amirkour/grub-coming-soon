require 'bundler'
Bundler.setup(:default)
require 'haml'
require 'sinatra/base'
require 'sinatra/reloader'

class Grubalub < Sinatra::Base
	set :app_file, __FILE__

	configure :development do
		register Sinatra::Reloader
	end

	get "/" do
		haml :index
	end
end
