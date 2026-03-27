from django.urls import path

from . import views

urlpatterns = [
    path("chat/", views.chat_view, name="agri-chat"),
    path("rag/", views.rag_query_view, name="agri-rag"),
    path("sql/", views.sql_query_view, name="agri-sql"),
    path("evaluate/", views.evaluate_view, name="agri-evaluate"),
    path("ingest/", views.ingest_view, name="agri-ingest"),
]
