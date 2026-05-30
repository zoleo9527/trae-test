from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.audit.services import OverdueReminderService


class Command(BaseCommand):
    help = '检查所有逾期项（借阅、巡检、报修）并生成提醒'

    def handle(self, *args, **options):
        self.stdout.write(f'开始检查逾期项: {timezone.now()}')

        results = OverdueReminderService.check_all_overdue()

        total_created = 0
        total_updated = 0

        for module, items in results.items():
            created = len([x for x in items if x[0] == 'created'])
            updated = len([x for x in items if x[0] == 'updated'])
            total_created += created
            total_updated += updated

            self.stdout.write(
                f'  {module}: 新增 {created} 条, 更新 {updated} 条'
            )
            for action, reminder in items:
                status = '✓' if action == 'created' else '↻'
                self.stdout.write(
                    f'    {status} [{reminder.type}] {reminder.related_object_repr} '
                    f'(逾期{reminder.overdue_days}天, 提醒{reminder.reminder_count}次)'
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n完成: 共新增 {total_created} 条提醒, 更新 {total_updated} 条提醒'
            )
        )
