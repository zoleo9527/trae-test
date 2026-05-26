from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.tea.models import (
    ActivitySubmission, Batch, Order, PriceApproval, Shipment, Store,
    Warehouse,
)
from apps.tea.services import AuditService


@receiver(post_save, sender=PriceApproval, dispatch_uid='price_approval_post_save')
def price_approval_post_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(instance, 'CREATE')


@receiver(post_save, sender=ActivitySubmission, dispatch_uid='activity_submission_post_save')
def activity_submission_post_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(instance, 'CREATE')


@receiver(post_save, sender=Batch, dispatch_uid='batch_post_save')
def batch_post_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(instance, 'CREATE')


@receiver(post_save, sender=Shipment, dispatch_uid='shipment_post_save')
def shipment_post_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(instance, 'CREATE')
