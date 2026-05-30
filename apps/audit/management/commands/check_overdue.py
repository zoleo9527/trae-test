from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.audit.services import OverdueReminderService


class Command(BaseCommand):
    help = '检查所有逾期项（借阅、巡检、报修）并生成提醒'

    def add_arguments(self, parser):
        parser.add_argument(
            '--module',
            type=str,
            default='all',
            help='指定检查模块: all, borrow, inspection, repair',
        )

    def handle(self, *args, **options):
        module = options['module']
        self.stdout.write(f'开始检查逾期项 [{module}]: {timezone.now()}')

        results, summary = OverdueReminderService.check_all_overdue(
            trigger_type='command',
            operator=None
        )

        total_created = summary['total_created']
        total_updated = summary['total_updated']

        for mod, module_summary in summary['by_module'].items():
            if module != 'all' and mod != module:
                continue
            created = module_summary['created']
            updated = module_summary['updated']

            self.stdout.write(
                f'  {mod}: 新增 {created} 条, 更新 {updated} 条'
            )
            for action, reminder in results.get(mod, []):
                status = '✓' if action == 'created' else '↻'
                level = '🔴' if reminder.overdue_days >= 7 else '🟠' if reminder.overdue_days >= 3 else '🟡'
                self.stdout.write(
                    f'    {status} {level} [{reminder.type}] {reminder.related_object_repr} '
                    f'(逾期{reminder.overdue_days}天, 提醒{reminder.reminder_count}次)'
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n完成: 共新增 {total_created} 条提醒, 更新 {total_updated} 条提醒'
            )
        )
