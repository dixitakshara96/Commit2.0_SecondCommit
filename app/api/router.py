from fastapi import APIRouter

from app.admin.router import router as admin_router
from app.analysis.router import router as analysis_router
from app.analysis.contributor_router import router as contributor_router
from app.analysis.outreach_router import router as outreach_router
from app.auth.router import router as auth_router
from app.dashboard.router import router as dashboard_router
from app.freelancer.router import router as freelancer_router
from app.idea.router import router as idea_router
from app.repositories.router import router as repositories_router
from app.response_tracker.router import router as response_tracker_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(idea_router)
api_router.include_router(repositories_router)
api_router.include_router(analysis_router)
api_router.include_router(contributor_router)
api_router.include_router(outreach_router)
api_router.include_router(dashboard_router)
api_router.include_router(response_tracker_router)
api_router.include_router(freelancer_router)
api_router.include_router(admin_router)