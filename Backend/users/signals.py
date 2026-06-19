from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import User, Notification
from django.utils import timezone

@receiver(pre_save, sender=User)
def check_verification_status_change(sender, instance, **kwargs):
    if instance.id is None:
        pass
    else:
        try:
            previous = User.objects.get(id=instance.id)
            if previous.verification_status != instance.verification_status:
                if instance.verification_status in ['verified', 'rejected']:
                    instance.reviewed_at = timezone.now()
                
                if instance.verification_status == 'pending':
                    instance.submitted_at = timezone.now()

                if instance.verification_status == 'verified':
                    Notification.objects.create(
                        user=instance,
                        title='Account Verified',
                        message='Your account has been successfully verified! You can now post and accept jobs.'
                    )
                elif instance.verification_status == 'rejected':
                    reason = instance.rejection_reason or 'No reason provided.'
                    Notification.objects.create(
                        user=instance,
                        title='Verification Rejected',
                        message=f'Your document verification was rejected. Reason: {reason}. Please re-upload your documents.'
                    )
        except User.DoesNotExist:
            pass
