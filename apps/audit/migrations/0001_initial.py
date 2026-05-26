from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(blank=True, max_length=150, null=True, verbose_name='用户名')),
                ('action', models.CharField(choices=[('create', '创建'), ('update', '更新'), ('delete', '删除'), ('approve', '审核通过'), ('reject', '审核驳回'), ('review', '标记回查'), ('login', '登录'), ('logout', '登出'), ('export', '导出'), ('import', '导入')], max_length=50, verbose_name='操作类型')),
                ('model_name', models.CharField(blank=True, max_length=100, null=True, verbose_name='模型名称')),
                ('object_id', models.CharField(blank=True, max_length=100, null=True, verbose_name='对象ID')),
                ('object_repr', models.CharField(blank=True, max_length=255, null=True, verbose_name='对象描述')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP地址')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='用户代理')),
                ('path', models.CharField(blank=True, max_length=255, null=True, verbose_name='请求路径')),
                ('method', models.CharField(blank=True, max_length=10, null=True, verbose_name='请求方法')),
                ('message', models.TextField(verbose_name='操作描述')),
                ('old_values', models.JSONField(blank=True, null=True, verbose_name='变更前数据')),
                ('new_values', models.JSONField(blank=True, null=True, verbose_name='变更后数据')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='操作时间')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to='auth.user', verbose_name='操作人')),
            ],
            options={
                'verbose_name': '审计日志',
                'verbose_name_plural': '审计日志',
                'db_table': 'audit_log',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['-created_at'], name='audit_log_created_72d96d_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['user', '-created_at'], name='audit_log_user_id_d0447a_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['model_name', 'object_id'], name='audit_log_model_n_75b9e4_idx'),
        ),
    ]
