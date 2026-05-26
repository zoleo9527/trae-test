from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('customer', '0001_initial'),
        ('weight', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='CreditRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('record_no', models.CharField(max_length=50, unique=True, verbose_name='赊账编号')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=14, verbose_name='赊账金额')),
                ('due_date', models.DateField(verbose_name='约定还款日期')),
                ('status', models.CharField(choices=[('pending', '待确认'), ('approved', '已确认'), ('rejected', '已驳回')], default='pending', max_length=20, verbose_name='状态')),
                ('remark', models.TextField(blank=True, null=True, verbose_name='备注')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True, verbose_name='确认时间')),
                ('reject_reason', models.TextField(blank=True, null=True, verbose_name='驳回原因')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='creditrecord_created', to='auth.user', verbose_name='创建人')),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='customer.customer', verbose_name='客户')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_credits', to='auth.user', verbose_name='确认人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='creditrecord_updated', to='auth.user', verbose_name='更新人')),
                ('weight_ticket', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='weight.weightticket', verbose_name='关联磅单')),
            ],
            options={
                'verbose_name': '赊账记录',
                'verbose_name_plural': '赊账记录',
                'db_table': 'credit_record',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='RepaymentRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('record_no', models.CharField(max_length=50, unique=True, verbose_name='回款编号')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=14, verbose_name='回款金额')),
                ('payment_method', models.CharField(choices=[('cash', '现金'), ('transfer', '银行转账'), ('wechat', '微信'), ('alipay', '支付宝'), ('deduction', '抵扣货款')], default='cash', max_length=20, verbose_name='付款方式')),
                ('payment_time', models.DateTimeField(verbose_name='付款时间')),
                ('status', models.CharField(choices=[('pending', '待确认'), ('approved', '已确认'), ('rejected', '已驳回')], default='pending', max_length=20, verbose_name='状态')),
                ('voucher_photo', models.ImageField(blank=True, null=True, upload_to='repayment_vouchers/', verbose_name='付款凭证')),
                ('remark', models.TextField(blank=True, null=True, verbose_name='备注')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True, verbose_name='确认时间')),
                ('reject_reason', models.TextField(blank=True, null=True, verbose_name='驳回原因')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='repaymentrecord_created', to='auth.user', verbose_name='创建人')),
                ('credit_record', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='repayments', to='credit.creditrecord', verbose_name='关联赊账')),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='customer.customer', verbose_name='客户')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_repayments', to='auth.user', verbose_name='确认人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='repaymentrecord_updated', to='auth.user', verbose_name='更新人')),
            ],
            options={
                'verbose_name': '回款记录',
                'verbose_name_plural': '回款记录',
                'db_table': 'repayment_record',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CreditReminder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('type', models.CharField(choices=[('due_soon', '即将到期'), ('overdue', '已逾期'), ('custom', '自定义提醒')], max_length=20, verbose_name='提醒类型')),
                ('title', models.CharField(max_length=200, verbose_name='提醒标题')),
                ('content', models.TextField(verbose_name='提醒内容')),
                ('reminder_date', models.DateField(verbose_name='提醒日期')),
                ('is_read', models.BooleanField(default=False, verbose_name='是否已读')),
                ('is_handled', models.BooleanField(default=False, verbose_name='是否已处理')),
                ('handled_at', models.DateTimeField(blank=True, null=True, verbose_name='处理时间')),
                ('handle_note', models.TextField(blank=True, null=True, verbose_name='处理备注')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='creditreminder_created', to='auth.user', verbose_name='创建人')),
                ('credit_record', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='credit.creditrecord', verbose_name='关联赊账')),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='customer.customer', verbose_name='客户')),
                ('handled_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='handled_reminders', to='auth.user', verbose_name='处理人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='creditreminder_updated', to='auth.user', verbose_name='更新人')),
            ],
            options={
                'verbose_name': '回款提醒',
                'verbose_name_plural': '回款提醒',
                'db_table': 'credit_reminder',
                'ordering': ['-created_at'],
            },
        ),
    ]
