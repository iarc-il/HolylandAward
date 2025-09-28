from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Request, HTTPException, status

clerk = Clerk(bearer_auth="ADDKEY")


# Define the authentication dependency
async def verify_clerk_session(request: Request):
    """
    Verifies the user's session using Clerk's SDK and returns the user ID.
    Raises an HTTPException if the user is not authenticated.
    """
    try:
        # Pass the raw FastAPI request object to Clerk's authentication method.
        # This handles parsing the Authorization header and verifying the JWT.
        session = clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(authorized_parties=["http://localhost:5173"]),
        )

        # The session object contains all the user and session data
        if not session.is_signed_in:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated."
            )

        # Return the user_id, which can be injected into the route handler
        return session.payload["sub"]

    except Exception as e:
        # Catch any exceptions during authentication and return a 401 error
        print(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )
