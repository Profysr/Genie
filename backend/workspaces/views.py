from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Workspace, WorkspaceMember, WorkspaceInvite
from .serializers import WorkspaceSerializer, WorkspaceMemberSerializer, WorkspaceInviteSerializer


class WorkspaceListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        workspaces = Workspace.objects.filter(members__user=request.user).distinct()
        serializer = WorkspaceSerializer(workspaces, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = WorkspaceSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkspaceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, slug, user):
        return get_object_or_404(Workspace, slug=slug, members__user=user)

    def get(self, request, slug):
        workspace = self.get_object(slug, request.user)
        return Response(WorkspaceSerializer(workspace, context={"request": request}).data)

    def patch(self, request, slug):
        workspace = self.get_object(slug, request.user)
        serializer = WorkspaceSerializer(workspace, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug):
        workspace = self.get_object(slug, request.user)
        if workspace.owner != request.user:
            return Response({"detail": "Only the owner can delete this workspace."}, status=status.HTTP_403_FORBIDDEN)
        workspace.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class WorkspaceMemberListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.kwargs["slug"], members__user=self.request.user)
        return workspace.members.select_related("user").all()


class WorkspaceMemberDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, slug, member_id, user):
        workspace = get_object_or_404(Workspace, slug=slug, members__user=user)
        return get_object_or_404(WorkspaceMember, workspace=workspace, id=member_id), workspace

    def patch(self, request, slug, member_id):
        member, workspace = self.get_object(slug, member_id, request.user)
        is_admin = WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user, role=WorkspaceMember.Role.ADMIN
        ).exists()

        if not is_admin:
            return Response({"detail": "Only admins can update member roles."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = WorkspaceMemberSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug, member_id):
        member, workspace = self.get_object(slug, member_id, request.user)
        if member.user == request.user:
            return Response({"detail": "You cannot remove yourself."}, status=status.HTTP_400_BAD_REQUEST)
        is_admin = WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user, role=WorkspaceMember.Role.ADMIN
        ).exists()
        if not is_admin:
            return Response({"detail": "Only admins can remove members."}, status=status.HTTP_403_FORBIDDEN)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InviteMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug, members__user=request.user)
        serializer = WorkspaceInviteSerializer(
            data=request.data,
            context={"request": request, "workspace": workspace}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AcceptInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        invite = get_object_or_404(WorkspaceInvite, token=token, status=WorkspaceInvite.Status.PENDING)
        if invite.email != request.user.email:
            return Response({"detail": "This invite is for a different email address."}, status=status.HTTP_403_FORBIDDEN)
        WorkspaceMember.objects.get_or_create(
            workspace=invite.workspace,
            user=request.user,
            defaults={"role": invite.role, "invited_by": invite.invited_by},
        )
        invite.status = WorkspaceInvite.Status.ACCEPTED
        invite.save()
        return Response(WorkspaceSerializer(invite.workspace, context={"request": request}).data)
