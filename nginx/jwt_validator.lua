local jwt = require "resty.jwt"

-- Load public key from file
local public_key_path = "/etc/nginx/ssl/public.pem"
local public_key_file = io.open(public_key_path, "r")
if not public_key_file then
    ngx.log(ngx.ERR, "Failed to open public key file: " .. public_key_path)
    return ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
end
local public_key = public_key_file:read("*all")
public_key_file:close()

-- JWT validation function
local function validate_jwt(token)
    local jwt_obj = jwt:verify(public_key, token)
    if jwt_obj.verified then
        ngx.req.set_header("X-User-Id", jwt_obj.payload.sub)
        return true
    else
        ngx.log(ngx.ERR, "JWT validation failed: " .. jwt_obj.reason)
        return false
    end
end

-- Read JWT token from Authorization header
local headers = ngx.req.get_headers()
local auth_header = headers["Authorization"]
if auth_header then
    local _, _, token = string.find(auth_header, "Bearer%s+(.+)")
    if token then
        if validate_jwt(token) then
            return
        end
    end
end

-- Return unauthorized if JWT validation fails
ngx.status = ngx.HTTP_UNAUTHORIZED
ngx.say("Unauthorized")
ngx.exit(ngx.HTTP_UNAUTHORIZED)
