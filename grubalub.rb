require 'bundler'
Bundler.setup(:default)
require 'haml'
require 'json'
require 'sinatra/json'
require 'sinatra/base'
require 'sinatra/reloader'
require 'sinatra/multi_route'
require 'omniauth'
require 'omniauth-google-oauth2'

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

	# post "/login/:type" do
	# 	auth_endpoint=nil
	# 	case params[:type]
	# 	when "google"
	# 		auth_endpoint="/auth/google_oauth2"
	# 	when "developer"
	# 		auth_endpoint="/auth/developer"
	# 	else
	# 		raise "unrecognized auth type #{params[:type]}"
	# 	end

	# 	redirect to(auth_endpoint)
	# end

	route :get, :post, '/auth/:provider/callback' do

        auth_hash=request.env['omniauth.auth']
        if auth_hash.nil?
            status 500
            halt haml(:error, :locals=>{:msg=>"Missing required omniauth.auth hash"})
        end
        
        info_hash=auth_hash[:info]
        unless info_hash
            status 500
            halt haml(:error, :locals=>{:mst=>"Failed to retrieve info hash from auth hash"})
        end

        user_name=info_hash[:name]
        user_email=info_hash[:email]
        if user_name.nil? || user_email.nil?
            status 500
            halt haml(:error, :locals=>{:msg=>"Failed to retrieve info.name and/or info.email from info hash"})
        end

        puts "User is #{user_name} and email is #{user_email}"
        # unless login(user_name,user_email)
        #     status 401
        #     halt haml(:error, :locals=>{:msg=>"Login failed for #{user_name} (#{user_email}) - are you on the list!?"})
        # end

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
		puts "is debugging working?"
		haml :index
	end
end
