<template>
  <div class="data-import-wrapper">
    <div class="tab-card-wrapper">
      <div class="text-center mb-30">
        <h2>{{ $t('migration.center_title') }}</h2>
        <p class="text-secondary">{{ $t('migration.center_desc') }}</p>
      </div>

      <div class="max-w-100p m-auto">
        
        <!-- 统一的拖拽上传区域 -->
        <el-upload
          class="migration-import-upload"
          drag
          action="#"
          multiple
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileUpload"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            <p><el-tag type="success" effect="light">{{ $t('migration.auto_identify_tip') }}</el-tag></p>
            <p><span v-html="$t('migration.drag_drop_tip')"></span></p>
          </div>
          <template #tip>
            <div class="migration-import-tips">
              <h4>{{ $t('migration.support_desc') }}</h4>
              <div class="migration-format-groups">
                <div class="migration-format-group">
                  <h4>📁 {{ $t('migration.system_backup_format') }}</h4>
                  <div class="migration-tags">
                    <el-tag type="info" effect="light"><el-icon><Lock /></el-icon> {{ $t('migration.encrypted_backup_json') }}</el-tag>
                    <el-tag type="info" effect="light"><el-icon><Unlock /></el-icon> {{ $t('migration.plaintext_backup_json') }}</el-tag>
                  </div>
                </div>

                <div class="migration-format-group">
                  <h4>📱 {{ $t('migration.mobile_app_format') }}</h4>
                  <div class="migration-tags">
                    <el-tag type="info" effect="light"><icon2FAS /> 2FAS (.2fas)</el-tag>
                    <el-tag type="info" effect="light"><iconAegis /> Aegis (.json/.txt)</el-tag>
                    <el-tag type="info" effect="light"><iconBitwarden /> Bitwarden Auth (.json/.csv)</el-tag>
                    <el-tag type="info" effect="light"><iconProtonAuth /> Proton Auth (.json)</el-tag>
                    <el-tag type="info" effect="light"><iconEnte /> Ente Auth (.txt)</el-tag>
                    <el-tag type="info" effect="light"><iconGoogleAuth /> Google Auth (.png/.jpg)</el-tag>
                    <el-tag type="info" effect="light"><iconMicrosoftAuth /> Microsoft Auth (PhoneFactor)</el-tag>
                  </div>
                  <div class="migration-ga-tip">
                    <span>Google Authenticator</span>
                    <p>{{ $t('migration.ga_auth_desc') }}</p>
                  </div>
                  <div class="migration-ms-tip">
                    <span>{{ $t('migration.ms_auth_desc') }}</span>
                    <p>{{ $t('migration.ms_auth_detail') }}:<br />
                      <code>/data/data/com.azure.authenticator/databases/PhoneFactor</code><br />
                      <code>/data/data/com.azure.authenticator/databases/PhoneFactor-wal</code><br />
                      <code>/data/data/com.azure.authenticator/databases/PhoneFactor-shm</code>
                    </p>
                  </div>
                </div>

                <div class="migration-format-group">
                  <h4>📄 {{ $t('migration.generic_format') }}</h4>
                  <div class="migration-tags">
                    <el-tag type="info" effect="light"><el-icon><Document /></el-icon> {{ $t('migration.generic_json') }}</el-tag>
                    <el-tag type="info" effect="light"><el-icon><Tickets /></el-icon> OTPAuth URI (.txt)</el-tag>
                    <el-tag type="info" effect="light"><el-icon><Grid /></el-icon> {{ $t('migration.spreadsheet_csv') }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-upload>

      </div>
    </div>

    <!-- 批量导入进度弹窗 -->
    <el-dialog
      v-model="showBatchProgress"
      :title="$t('migration.batch_import_processing')"
      width="450px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="text-center py-10">
        <el-progress 
          type="dashboard" 
          :percentage="batchProgressPercent" 
          :status="batchProgressPercent === 100 ? 'success' : ''" 
        />
        <h3 class="mt-20">
          {{ $t('migration.batch_progress', { processed: batchProcessedJobs, total: batchTotalJobs }) }}
        </h3>
        <p class="text-secondary mt-10">
          {{ batchCurrentTaskName }}
        </p>
      </div>
    </el-dialog>

    <!-- 加密文件密码输入弹窗 -->
    <el-dialog v-model="showDecryptDialog" :title="$t('migration.decrypt_backup_title')" width="400px" @close="handleDecryptDialogClose" destroy-on-close>
      <el-alert v-if="currentImportType === 'aegis_encrypted'" :title="$t('migration.detect_aegis')" type="warning" :closable="false" class="mb-15" />
      <el-alert v-else-if="currentImportType === 'proton_encrypted'" :title="$t('migration.detect_proton')" type="warning" :closable="false" class="mb-15" />
      <el-alert v-else-if="currentImportType === '2fas_encrypted'" :title="$t('migration.detect_2fas')" type="warning" :closable="false" class="mb-15" />
      <el-alert v-else-if="currentImportType === 'ente_encrypted'" :title="$t('migration.detect_ente')" type="warning" :closable="false" class="mb-15" />
      <el-alert v-else :title="$t('migration.detect_system')" type="success" :closable="false" class="mb-15" />
      <el-form label-position="top">
        <el-form-item :label="$t('migration.input_decrypt_pwd_label')">
          <el-input v-model="importPassword" type="password" show-password @keyup.enter="submitEncryptedData" :placeholder="$t('migration.input_decrypt_pwd_placeholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDecryptDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="isDecrypting" @click="submitEncryptedData">{{ $t('migration.confirm_decrypt_import') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { UploadFilled, Lock, Unlock, Document, Tickets, Grid } from '@element-plus/icons-vue'
import { useDataImport } from '@/features/migration/composables/useDataImport'

// icons for import options (follow export page style)
import icon2FAS from '@/shared/components/icons/icon2FAS.vue'
import iconAegis from '@/shared/components/icons/iconAegis.vue'
import iconGoogleAuth from '@/shared/components/icons/iconGoogleAuth.vue'
import iconBitwarden from '@/shared/components/icons/iconBitwarden.vue'
import iconMicrosoftAuth from '@/shared/components/icons/iconMicrosoftAuth.vue'
import iconProtonAuth from '@/shared/components/icons/iconProtonAuth.vue'
import iconEnte from '@/shared/components/icons/iconEnte.vue'

const emit = defineEmits(['success'])

const {
  currentImportType,
  showDecryptDialog,
  importPassword,
  isDecrypting,
  showBatchProgress,
  batchCurrentTaskName,
  batchProcessedJobs,
  batchTotalJobs,
  batchProgressPercent,
  handleFileUpload,
  submitEncryptedData,
  handleDecryptDialogClose
} = useDataImport(emit)

</script>

