from django.db import models
from django.utils import timezone


class PendingQuerySet(models.QuerySet):
    def pending(self):
        return self.filter(status='pending')

    def approved(self):
        return self.filter(status='approved')

    def rejected(self):
        return self.filter(status='rejected')


class ReviewNeededQuerySet(models.QuerySet):
    def needing_review(self):
        today = timezone.now().date()
        return self.filter(
            status__in=['approved', 'completed'],
            activity_period_to__lt=today,
        ).exclude(
            trial_followups__isnull=False,
        )
