require 'bundler'
Bundler.setup(:default)
require 'uri'
require 'haml'
require 'json'
require 'sinatra/json'
require 'sinatra/base'
require 'sinatra/reloader'
require 'sinatra/multi_route'
require 'omniauth'
require 'omniauth-google-oauth2'
require 'mongooz'

class Users<Mongooz::MongoozHash
	property :email
	property :name
	property :roll
	def is_admin?
		self.roll=="admin"
	end
end

class Grubalub < Sinatra::Base
	set :app_file, __FILE__
	set :sessions, true
	register Sinatra::MultiRoute
    register Sinatra::JSON

	configure :development do
		register Sinatra::Reloader
		use OmniAuth::Builder do
			provider :developer
        end
        set :show_exceptions, false

        Mongooz.defaults :db=>"grubalub"

        # including this in dev causes omniauth failures to hit your failure
        # route.  otherwise, omniauth failures will throw an exception in dev
        # OmniAuth.config.on_failure = Proc.new { |env|
        # 	OmniAuth::FailureEndpoint.new(env).redirect_to_failure
        # }
	end

	configure :production do
		set :ssl_port=>443
		use OmniAuth::Builder do
            provider :google_oauth2, ENV["GOOGLE_KEY"], ENV["GOOGLE_SECRET"]
        end

        connection_string=ENV['MONGOHQ_URL']
		raise "Missing required MONGOHQ_URL env variable for db connection" unless connection_string

		connection_uri=URI.parse(connection_string)
		db_name=connection_uri.path.gsub(/^\//, '')
		db_host=connection_uri.host
		db_port=connection_uri.port
		db_user=connection_uri.user
		db_password=connection_uri.password
		Mongooz.defaults :host=>db_host, :port=>db_port, :db=>db_name, :user=>db_user, :password=>db_password
	end

	helpers do
		def logged_in_user
			session[:user]
		end
		def login(user)
			session[:user]=user
		end
		def logout_user
			session[:user]=nil
		end
	end

	error do
		exception=env['sinatra.error']
		@unexpected_error_msg=exception.respond_to?(:message) ? exception.message : "Unknown error"
		haml :error
	end

	get '/auth/failure' do
		error_msg=params[:message] || "unknown error"
		logout_user

		raise "there was a login error: #{error_msg}"
	end

	route :get, :post, '/auth/:provider/callback' do

        auth_hash=request.env['omniauth.auth']
        unless auth_hash
            @error_msg="Missing required omniauth.auth hash"
            halt 500, haml(:error)
        end
        
        info_hash=auth_hash[:info]
        unless info_hash
        	@error_msg="Failed to retrieve info hash from auth hash"
            halt 500, haml(:error)
        end

        user_name=info_hash[:name]
        user_email=info_hash[:email]
        unless user_name && user_email
            @error_msg="Failed to retrieve info.name and/or info.email from info hash"
            halt 500, haml(:error)
        end

        puts "User is #{user_name} and email is #{user_email}"
        user_list=Users.db_query({:email=>user_email, :name=>user_name})
        raise "Unrecognized user: #{user_name}" unless user_list && user_list.length>0

        user=user_list[0]
        raise "Access denied" unless user.is_admin?

        login(user)
        redirect to("/")
    end

	get "/login" do

		# in prod, ensure login is over ssl
		redirect to("https://#{request.host}:#{settings.ssl_port}/login") if settings.production? && !request.secure?

		# if user is already logged in, send them back to homepage
		redirect to("/") if logged_in_user

		# user is not logged in and request is now secure - display login page
		haml :login
	end

	get "/logout" do
		logout_user
		redirect to("/");
	end

	get "/" do
		@user=logged_in_user
		haml :index
	end

	get "/new/food" do
		@user=logged_in_user
		raise "Unauthorized Access" unless @user && @user.is_admin?
		haml :"food-create"
	end
end
