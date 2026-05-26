from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('customer', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeightTicket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('ticket_no', models.CharField(max_length=50, unique=True, verbose_name='磅单编号')),
                ('gross_weight', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='毛重(kg)')),
                ('tare_weight', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='皮重(kg)')),
                ('net_weight', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='净重(kg)')),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='单价(元/kg)')),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=14, verbose_name='总金额')),
                ('payment_method', models.CharField(choices=[('cash', '现金'), ('credit', '赊账'), ('transfer', '转账')], default='cash', max_length=20, verbose_name='付款方式')),
                ('status', models.CharField(choices=[('pending', '待审核'), ('approved', '已通过'), ('rejected', '已驳回'), ('review', '需回查')], default='pending', max_length=20, verbose_name='状态')),
                ('weigh_time', models.DateTimeField(verbose_name='过磅时间')),
                ('vehicle_no', models.CharField(blank=True, max_length=50, null=True, verbose_name='车牌号')),
                ('driver', models.CharField(blank=True, max_length=50, null=True, verbose_name='司机')),
                ('site_photo', models.ImageField(blank=True, null=True, upload_to='weight_tickets/', verbose_name='现场照片')),
                ('remark', models.TextField(blank=True, null=True, verbose_name='备注')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True, verbose_name='审核时间')),
                ('reject_reason', models.TextField(blank=True, null=True, verbose_name='驳回原因')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='weightticket_created', to='auth.user', verbose_name='创建人')),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='customer.customer', verbose_name='客户')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_tickets', to='auth.user', verbose_name='审核人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='weightticket_updated', to='auth.user', verbose_name='更新人')),
                ('waste_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='customer.wastetype', verbose_name='废品类型')),
            ],
            options={
                'verbose_name': '磅单',
                'verbose_name_plural': '磅单',
                'db_table': 'weight_ticket',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PriceAdjustment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('old_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='原单价')),
                ('new_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='新单价')),
                ('reason', models.TextField(verbose_name='调整原因')),
                ('effective_date', models.DateField(verbose_name='生效日期')),
                ('is_effective', models.BooleanField(default=True, verbose_name='是否生效')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='priceadjustment_created', to='auth.user', verbose_name='创建人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='priceadjustment_updated', to='auth.user', verbose_name='更新人')),
                ('waste_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='customer.wastetype', verbose_name='废品类型')),
            ],
            options={
                'verbose_name': '价格调整记录',
                'verbose_name_plural': '价格调整记录',
                'db_table': 'price_adjustment',
                'ordering': ['-created_at'],
            },
        ),
    ]
